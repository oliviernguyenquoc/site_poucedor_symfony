<?php
// src/Pouce/UserBundle/Entity/User.php

namespace Pouce\UserBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo; // this will be like an alias for Gedmo extensions annotations
use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Validator\Constraints AS Assert;


/**
 * @ORM\Entity
 * @ORM\Table(name="user")
 * @ORM\Entity(repositoryClass="Pouce\UserBundle\Entity\UserRepository")
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
     * @Assert\NotBlank(message="Entrez votre prénom.", groups={"updateRegistration"})
     */
    protected $first_name;

    /*
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre nom de famille.", groups={"updateRegistration"})
     */
    protected $last_name;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre sexe.", groups={"updateRegistration"})
     * @Assert\Choice({"Homme", "Femme"})
     */
    protected $sex;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre promotion.", groups={"updateRegistration"})
     */
    protected $promotion;

    /**
     * @ORM\Column(type="string", nullable=true)
     * @Assert\NotBlank(message="Entrez votre numéro de téléphone.", groups={"updateRegistration"})
     */
    protected $telephone;

    /**
     * @ORM\ManyToMany(targetEntity="Pouce\TeamBundle\Entity\Team", mappedBy="users")
     */
    private $teams;

    /**
     * @var datetime $created
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @var \DateTime $updated
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     */
    private $updated;


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
     * @param string $first_name
     * @return User
     */
    public function setFirstName($first_name)
    {
        $this->first_name = $first_name;

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
     * @param string $last_name
     * @return User
     */
    public function setLastName($last_name)
    {
        $this->last_name = $last_name;

        return $this;
    }

    /**
     * Get last_name
     *
     * @return string 
     */
    public function getLastName()
    {
        return $this->last_name;
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

    /**
     * Set updated
     *
     * @param \DateTime $updated
     */
    public function setUpdated($updated)
    {
        $this->updated = $updated;

        return $this;
    }

    /**
     * Get updated
     *
     * @return \DateTime 
     */
    public function getUpdated()
    {
        return $this->updated;
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
    /**
     * Constructor
     */
    public function __construct()
    {
        parent::__construct();
        $this->teams = new ArrayCollection();
    }

    /**
     * Add teams
     *
     * @param \Pouce\TeamBundle\Entity\Team $teams
     * @return User
     */
    public function addTeam(\Pouce\TeamBundle\Entity\Team $teams)
    {
        $this->teams[] = $teams;
        $teams->addUser($this);

        return $this;
    }

    /**
     * Remove teams
     *
     * @param \Pouce\TeamBundle\Entity\Team $teams
     */
    public function removeTeam(\Pouce\TeamBundle\Entity\Team $teams)
    {
        $this->teams->removeElement($teams);
        $teams->setUser(null);
    }

    /**
     * Get teams
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getTeams()
    {
        return $this->teams;
    }
}
