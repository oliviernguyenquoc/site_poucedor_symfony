<?php

namespace Pouce\TeamBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

use Pouce\TeamBundle\Form\PositionType;

class ResultAdminType extends AbstractType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        for($i=0;$i<=48;$i++)
        { 
            $choix[] = $i . ' h'; 
        }
        $choix[] = '> 48 h';
        $builder
            ->add('isValid', 'checkbox', array(
                'label'     => false,
                'required'  => false
            ))
            ->add('lateness','choice', array(
                'choices'   => $choix,
                'label'     => false
            ))
            ;
    }
    
    /**
     * @param OptionsResolverInterface $resolver
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'Pouce\TeamBundle\Entity\Result'
        ));
    }

    /**
     * @return string
     */
    public function getName()
    {
        return 'pouce_teambundle_result';
    }
}
