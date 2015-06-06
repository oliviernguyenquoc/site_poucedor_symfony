<?php
// src/Pouce/UserBundle/Entity/User.php

namespace Pouce\UserBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo; // this will be like an alias for Gedmo extensions annotations
use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints AS Assert;

/**
 * @ORM\Entity
 * @ORM\Table(name="fos_user")
 */
class User extends BaseUser
{
    /**
     * @ORM\ManyToOne(targetEntity="Pouce\UserBundle\Entity\School")
     * @ORM\JoinColumn(name="school_id", referencedColumnName="id", nullable=false)
     *
     */
    private $school;

    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre prénom.", groups={"teamRegistration"})
     */
    protected $first_name;

    /*
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre nom de famille.", groups={"teamRegistration"})
     */
    protected $last_name;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre sexe.", groups={"teamRegistration"})
     * @Assert\Choice({"homme", "femme"})
     */
    protected $sex;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre promotion.", groups={"teamRegistration"})
     */
    protected $promotion;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre numéro de téléphone.", groups={"teamRegistration"})
     */
    protected $telephone;

    /**
     * @var datetime $created
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set first_name
     *
     * @param string $firstName
     * @return User
     */
    public function setFirstName($firstName)
    {
        $this->first_name = $firstName;

        return $this;
    }

    /**
     * Get first_name
     *
     * @return string 
     */
    public function getFirstName()
    {
        return $this->first_name;
    }

    /**
     * Set last_name
     *
     * @param string $firstName
     * @return User
     */
    public function setLastName($firstName)
    {
        $this->first_name = $firstName;

        return $this;
    }

    /**
     * Get first_name
     *
     * @return string 
     */
    public function getLastName()
    {
        return $this->first_name;
    }


    /**
     * Set sex
     *
     * @param string $sex
     * @return User
     */
    public function setSex($sex)
    {
        $this->sex = $sex;

        return $this;
    }

    /**
     * Get sex
     *
     * @return string 
     */
    public function getSex()
    {
        return $this->sex;
    }

    /**
     * Set promotion
     *
     * @param string $promotion
     * @return User
     */
    public function setPromotion($promotion)
    {
        $this->promotion = $promotion;

        return $this;
    }

    /**
     * Get promotion
     *
     * @return string 
     */
    public function getPromotion()
    {
        return $this->promotion;
    }

    /**
     * Set telephone
     *
     * @param string $telephone
     * @return User
     */
    public function setTelephone($telephone)
    {
        $this->telephone = $telephone;

        return $this;
    }

    /**
     * Get telephone
     *
     * @return string 
     */
    public function getTelephone()
    {
        return $this->telephone;
    }

    // A peut être utiliser en cas de bug
    // public function setEmail($email)
    // {
    //     if (is_null($this->getUsername())) {
    //         $this->setUsername(uniqid());
    //     }

    //     return parent::setEmail($email);
    // }

    /**
     * Set created
     *
     * @param \DateTime $created
     * @return User
     */
    public function setCreated($created)
    {
        $this->created = $created;

        return $this;
    }

    /**
     * Get created
     *
     * @return \DateTime 
     */
    public function getCreated()
    {
        return $this->created;
    }

    public function setSchool(School $school)
    {
    $this->school = $school;

    return $this;
    }

    public function getSchool()
    {
    return $this->school;
    }
}
